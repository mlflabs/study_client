/*
export const environment = {
  production: true,
  api_url: 'https://studyapi.mlflabs.com',

  service_events: 'events',
  service_groups: 'groups',
  service_changefeed: 'change-feed',
  token_expiery: 300, //how many days

  //blog
  service_blogs: 'blog',
  service_posts: 'posts',
  sync_collections: ['events', 'groups', 'test'],
  collections: ['events', 'groups', 'blog', 'posts', 'test']
  //admin

};
*/

export const environment = {
  production: true,
  pouch_prefix: 'study_',
  token_expiery: 300, // how many days
  auth_api: 'https://auth.mlflabs.com',
  couch_db: 'https://tasksapi.mlflabs.com/mlfstudy',
  access_meta_key: 'meta_access',
};
