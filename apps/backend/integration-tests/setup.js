// Referenced by jest.config.js `setupFiles`. MikroORM keeps model metadata in a
// process-wide registry, so a second test file defining the same models throws
// "Entity X is already registered" unless the registry is cleared first.
const { MetadataStorage } = require("@mikro-orm/core")

MetadataStorage.clear()
