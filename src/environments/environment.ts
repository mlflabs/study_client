
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
/*export const environment = {
  production: false,
  // api_url: 'http://localhost:3030',
  api_url: 'https://studyapi.mlflabs.com',

  service_events: 'events',
  service_groups: 'groups',
  service_changefeed: 'change-feed',
  token_expiery: 300, //how many days

  //blog
  service_blogs: 'blog',
  service_posts: 'posts',
  sync_collections: ['events', 'groups', 'test'],
  collections: ['events', 'groups', 'blog', 'posts', 'test'],
  //admin

};
*/
export const environment = {
  app_id: 'std',
  production: true,
  pouch_prefix: 'study_',
  token_expiery: 300, // how many days
  auth_api: 'https://auth.mlflabs.com',
  couch_db: 'http://localhost:3001/api_local',
  access_meta_key: 'meta_access',
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
