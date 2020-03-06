2020-03-06, Version 5.8.1
=========================

 * Update LTS status in README (Miroslav Bajtoš)

 * chore: update copyright year (Diana Lau)


2019-10-15, Version 5.8.0
=========================

 * Fix handling of http.errorStatus (Matthias Tylkowski)

 * Add Node.js 12.x to Travis CI config (Miroslav Bajtoš)

 * Drop support for Node.js 6.x (Miroslav Bajtoš)

 * chore: update copyrights years (Agnes Lin)


2019-04-10, Version 5.7.3
=========================

 * chore: upgrade loopback version (Raymond Feng)

 * Allow tag or param names to contain '-' or spaces (Raymond Feng)

 * fix: update lodash (jannyHou)


2019-01-07, Version 5.7.2
=========================

 * Fix route helper to ignore status/header retvals (Y.Shing)


2018-10-18, Version 5.7.1
=========================

 * README: update LTS status (Miroslav Bajtoš)


2018-08-30, Version 5.7.0
=========================

 * specgen: Retrieve description from package.json (Melle Boersma)

 * Upgrade eslint-config-loopback + fix formatting (Miroslav Bajtoš)


2018-07-10, Version 5.6.0
=========================

 * specgen: emit correct non-root return types (Dan Jarvis)

 * Update mocha & chai to latest (Miroslav Bajtoš)

 * Disable package-lock feature of npm (Miroslav Bajtoš)

 * Update eslint + config to latest (Miroslav Bajtoš)

 * Update strong-globalize and debug to latest (Miroslav Bajtoš)

 * Travis: add Node.js 8.x and 10.x (Miroslav Bajtoš)

 * Drop support for Node.js 4.x (Miroslav Bajtoš)

 * [WebFM] cs/pl/ru translation (candytangnb)


2017-12-04, Version 5.5.0
=========================

 * Improve support for $ref (Raymond Feng)


2017-11-21, Version 5.4.0
=========================

 * Handle embedded schemas for parameter/response (Raymond Feng)


2017-11-21, Version 5.3.0
=========================

 * Add support for examples in models and responses (Zak Barbuto)


2017-11-20, Version 5.2.2
=========================

 * Improve swagger mapping (Raymond Feng)

 * chore: update license (Diana Lau)


2017-10-27, Version 5.2.1
=========================

 * Fix file upload attachments (Zak Barbuto)


2017-10-27, Version 5.2.0
=========================

 * feat(route-helper): Add 'documented' flag for hiding params (Samuel Reed)


2017-10-13, Version 5.1.0
=========================

 * update strong-globalize to 3.1.0 (shimks)

 * CODEOWNERS: add zbarbuto (Miroslav Bajtoš)

 * update globalize string (Diana Lau)

 * fix basePath, add store.json (wing328)


2017-09-05, Version 5.0.0
=========================

 * Enable 'updateOnly' feature based on generateOperationScopedModels (#99) (Rashmi Hunt)

 * Bump version to 5.0.0 (Raymond Feng)

 * Set required to be true for path parameters (Raymond Feng)


2017-08-22, Version 4.2.0
=========================

 * Support updateOnly feature (#92) (Rashmi Hunt)

 * Add stalebot configuration (Kevin Delisle)

 * Update Issue and PR Templates (#95) (Sakib Hasan)


2017-08-14, Version 4.1.0
=========================

 * Allow externalDocs and custom names for models (Zak Barbuto)

 * Add support for file-type parameters (Zak Barbuto)

 * Add community maintainers to CODEOWNERS (Miroslav Bajtoš)

 * Add CODEOWNER file (Diana Lau)

 * Update eslint config to the latest (Miroslav Bajtoš)


2017-04-27, Version 4.0.3
=========================

 * type-registry: add DateString type (Kevin Delisle)

 * Travis CI config (Kevin Delisle)


2017-03-02, Version 4.0.2
=========================

 * Allow swagger 1.2 (Raymond Feng)


2017-03-02, Version 4.0.1
=========================

 * Use a default model is added if no tags found (Raymond Feng)

 * Replicate new issue_template from loopback (Siddhi Pai)

 * Replicate issue_template from loopback repo (Siddhi Pai)


2017-02-01, Version 4.0.0
=========================

 * Bump version to 4.0.0 (Raymond Feng)

 * Remove .npmignore (Raymond Feng)

 * Enhance Swagger to LoopBack mapping for code gen (Raymond Feng)

 * Upgrade eslint-config to 7.x, eslint to 3.x (Miroslav Bajtoš)


2016-12-22, Version 3.0.1
=========================

 * Omit null default values from schema (Heath Morrison)


2016-12-21, Version 3.0.0
=========================

 * fix: package.json to reduce vulnerabilities (Ryan Graham)

 * Update paid support URL (Siddhi Pai)

 * Adjust route parameters sequence (Tao Yuan)

 * Start 3.x + drop support for Node v0.10/v0.12 (siddhipai)

 * Drop support for Node v0.10 and v0.12 (Siddhi Pai)

 * Start the development of the next major version (Siddhi Pai)

 * Coerce form to formData in accepts.http.source (Simon Ho)

 * Fix date output format to "date-time" (Stefan B)


2016-10-13, Version 2.8.0
=========================

 * Update pt translation file (Candy)

 * Update ja translation file (Candy)

 * Update translation files - round#2 (Candy)

 * Add translated files (gunjpan)

 * Update deps to loopback 3.0.0 RC (Miroslav Bajtoš)

 * Remove juggler as a dependency (Amir Jafarian)


2016-09-13, Version 2.7.0
=========================

 * Allow setting null on error's responseModel (Alex Plescan)

 * Use juggler@3 and loopback@3 for testing (Amir Jafarian)


2016-09-07, Version 2.6.0
=========================

 * Allow object arguments to provide Model (Miroslav Bajtoš)

 * Expose object types as nested properties (Carl Fürstenberg)


2016-09-05, Version 2.5.0
=========================

 * Add `patch` verb in test (Amir Jafarian)

 * Add globalization. (Richard Pringle)

 * Update URLs in CONTRIBUTING.md (#49) (Ryan Graham)

 * Add doc root (jannyHou)

 * Add custom definition to swagger file (jannyHou)


2016-05-06, Version 2.4.3
=========================

 * update copyright notices and license (Ryan Graham)


2016-04-13, Version 2.4.2
=========================

 * Do not generate required if no item is present (Raymond Feng)

 * Fix linting errors (Amir Jafarian)

 * Auto-update by eslint --fix (Amir Jafarian)

 * Add eslint infrastructure (Amir Jafarian)


2016-04-07, Version 2.4.1
=========================

 * Disable the warning as it prints messages during loopback scaffolding (Raymond Feng)


2016-04-07, Version 2.4.0
=========================

 * improve scheme generation for return object (hideya kawahara)

 * Support default status codes (Candy)


2016-03-19, Version 2.3.2
=========================

 * Handle {id} and . in operation id (Raymond Feng)


2016-03-03, Version 2.3.1
=========================

 * Handle extensions under paths (Raymond Feng)


2016-02-09, Version 2.3.0
=========================

 * Make type geopoint case insensitive (Candy)

 * Treat property as type 'any' if not specified (Candy)

 * Exclude definition that are not referenced (Candy)

 * Fix handling of allOf when generating models (Gari Singh)


2015-12-02, Version 2.2.3
=========================

 * specgen: fix the definition of GeoPoint type (Miroslav Bajtoš)

 * Fix: hidden models referenced by hidden models (Miroslav Bajtoš)

 * Add GeoPoint support to explorer. (Candy)


2015-11-24, Version 2.2.2
=========================

 * specgen: ensure operation ids are unique (Miroslav Bajtoš)

 * Fix typo (Candy)

 * Refer to licenses with a link (Sam Roberts)


2015-11-03, Version 2.2.1
=========================

 * type-registry: code cleanup (Miroslav Bajtoš)

 * Register ObjectID for MongoDB, fix cause warning: Swagger: skipping unknown type "ObjectID" (Van-Duyet Le)

 * map ObjectID to string type (Clark Wang)


2015-10-14, Version 2.2.0
=========================

 * Add support for array types/refs (Raymond Feng)

 * Reformat the code (Raymond Feng)


2015-09-29, Version 2.1.2
=========================

 * Skip null values for length (Raymond Feng)

 * Use strongloop conventions for licensing (Sam Roberts)


2015-09-04, Version 2.1.1
=========================

 * README: link to loopback-explorer (Miroslav Bajtoš)

 * Remove the Labs label (Miroslav Bajtoš)


2015-09-03, Version 2.1.0
=========================

 * Add swagger-spec generator from loopback-explorer (Miroslav Bajtoš)

 * Update dependencies (Miroslav Bajtoš)

 * Move code generator to "codegen" subfolder (Miroslav Bajtoš)

 * Update package.json (Rand McKinney)

 * Update README.md (Rand McKinney)

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)


2014-12-18, Version 2.0.0
=========================

 * Bump version (Raymond Feng)

 * Fix the spec version for 2.0 (Raymond Feng)

 * Add contribution guidelines (Ryan Graham)


2014-09-06, Version 1.0.1
=========================

 * Bump version (Raymond Feng)

 * Tidy up the code generation (Raymond Feng)


2014-09-05, Version 1.0.0
=========================

 * Bump version (Raymond Feng)

 * Enhance tests (Raymond Feng)

 * Enhance type mapping (Raymond Feng)


2014-09-05, Version 1.0.0-beta2
===============================

 * Bump version (Raymond Feng)

 * Tidy up remoting metadata (Raymond Feng)


2014-09-03, Version 1.0.0-beta1
===============================

 * First release!
