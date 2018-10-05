import { Datetime } from '@ionic/angular';
const ObjectID = require('bson-objectid');




export class Doc {
  id?: string; //use this for graph and timeline, for now duplicate
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  meta_newid?: boolean;
  meta_removed?: boolean;
  meta_dirty?: boolean;

  constructor(values: Object = {}) {

    Object.assign(this, values);
  }
}

export class BlogItem extends Doc {
  heading?: string;
  slug?: string;
  body?: string;
}

export class BlogComment extends Doc {
  heading?: string;
  slug?: string;
  body?: string;
  author?: string;

  blog_id: string;
}

export class AppEvent extends Doc {
  message?: string;
  type?: string;
}

export class GroupItem extends Doc {
  content?: string;
  color?: string;
  visible?: boolean;

  constructor(values: Object = {}) {
    super();
    Object.assign(this, values);
  }

}

export class Edge {
  id?: string;
  to?: string;
  from?: string;
  label?: string;
  arrow?: string;
  dashes?: boolean;
  note?: string;
}

export function newEdge(props){
  //lets take props and add some defaults
  props.id = ObjectID.generate(Date.now() / 10);
  props.arrow = 'to';
  props.dashes = false;

  return {...{},...props};
}

export class EventItem extends Doc {
  content?: string;
  note?: string;
  start?: Date;
  end?: Date;
  type?: 'box' | 'point' | 'range' | 'background';
  group?: string;
  subgroup?: string;
  _nestedGroups?: [String];
  nestedGroups?: [String];

  to:[Edge];
  from:[Edge];

  viewDay?:string;  // = 1
  viewWeek?: string; // 7
  viewMonth?:string; // = 30
  viewYear?: string; // = 365
  viewDecade?: string; // = 3650
  viewCentury?: string; //= 36500
  viewMillenium?: string; // = 365000 days

  constructor(values: Object = {}) {
    super();
    Object.assign(this, values);
  }

}
