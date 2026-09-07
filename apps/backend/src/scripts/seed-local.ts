/**
 * Local development seed — enough store data to run a real checkout against
 * Moyasar test keys. Not used in production; production data lives in Railway.
 *
 * Run: npx medusa exec ./src/scripts/seed-local.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedLocal({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const store = container.resolve(Modules.STORE)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const regionModule = container.resolve(Modules.REGION)

  const [defaultStore] = await store.listStores()

  let [channel] = await salesChannelModule.listSalesChannels({
    name: "Default Sales Channel",
  })
  if (!channel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
    })
    channel = result[0]
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: defaultStore.id },
      update: {
        supported_currencies: [{ currency_code: "sar", is_default: true }],
        default_sales_channel_id: channel.id,
      },
    },
  })

  let [region] = await regionModule.listRegions({ name: "Saudi Arabia" })
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Saudi Arabia",
            currency_code: "sar",
            countries: ["sa"],
            payment_providers: ["pp_moyasar_moyasar"],
          },
        ],
      },
    })
    region = result[0]
  }

  try {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "sa", provider_id: "tp_system" }],
    })
  } catch (e) {
    logger.info(`tax region already present: ${(e as Error).message}`)
  }

  let [publishable] = await apiKeyModule.listApiKeys({
    type: "publishable",
    title: "Local storefront",
  })
  if (!publishable) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Local storefront", type: "publishable", created_by: "seed" },
        ],
      },
    })
    publishable = result[0]
  }
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishable.id, add: [channel.id] },
  })

  /*
    Deliberately NO shipping profile.

    Medusa derives a cart line item's requires_shipping from whether the
    product has a shipping profile (core-flows prepare-line-item-data:
    `hasShippingProfile || someInventoryRequiresShipping`). Attaching one here
    made this "digital" product require shipping, so checkout took the money
    and then completeCart refused the cart with 400 — measured on a real
    purchase, 49 SAR charged with no order created.

    Every product on the live store is digital and none has a shipping profile
    (verified against the production database: 0 of 17). Omitting it is what
    makes this seed reproduce production instead of contradicting it.
  */

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: "local-test-guide" },
  })

  if (!existing?.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "دليل اختبار محلي",
            handle: "local-test-guide",
            description: "منتج رقمي للاختبار المحلي فقط.",
            status: "published",
            metadata: { file_key: "local-test-guide.pdf" },
            sales_channels: [{ id: channel.id }],
            options: [{ title: "Format", values: ["PDF"] }],
            variants: [
              {
                title: "PDF",
                sku: "LOCAL-TEST-PDF",
                manage_inventory: false,
                options: { Format: "PDF" },
                prices: [{ amount: 4900, currency_code: "sar" }],
              },
            ],
          },
        ],
      },
    })
  }

  logger.info(`SEED_DONE publishable_key=${publishable.token} region=${region.id}`)
}
