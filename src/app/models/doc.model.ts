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

  events?: [EventItem];//temp storage of groups

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

  viewDayLabel?:string; 
  viewWeekLabel?: string;
  viewMonthLabel?:string;
  viewYearLabel?: string;
  viewDecadeLabel?: string;
  viewCenturyLabel?: string;
  viewMilleniumLabel?: string;
  view5MilleniumLabel?: string;
  viewDayHide?:boolean;  // = 1
  viewWeekHide?: boolean; // 7
  viewMonthHide?:boolean; // = 30
  viewYearHide?: boolean; // = 365
  viewDecadeHide?: boolean; // = 3650
  viewCenturyHide?: boolean; //= 36500
  viewMilleniumHide?: boolean; // = 365000 days
  view5MilleniumHide?: boolean; // = 365000 days

  constructor(values: Object = {}) {
    super();
    Object.assign(this, values);
  }
}

export const RANGE_LEVELS = [{
  days: 1825000,
  type: 'view5Millenium'
},{
  days: 365000,
  type: 'viewMillenium'
},{
  days: 36500,
  type: 'viewCentury'
},{
  days: 3650,
  type: 'viewDecade'
},{
  days: 365,
  type: 'viewYear'
},{
  days: 30,
  type: 'viewMonth'
},{
  days: 7,
  type: 'viewWeek'
},{
  days: 1,
  type: 'viewDay'
}];
