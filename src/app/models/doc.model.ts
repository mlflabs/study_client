import { Datetime } from '@ionic/angular';
const ObjectID = require('bson-objectid');




export class Doc {
  _id?: string | number;
  id?: string | number; //use this for graph and timeline, for now duplicate
  createdAt?: Date;
  updatedAt?: Date;

  _newid?: boolean;
  _removed?: boolean;
  _dirty?: boolean;

  constructor(values: Object = {}) {

    Object.assign(this, values);
  }


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

  to:[Edge];
  from:[Edge];

  constructor(values: Object = {}) {
    super();
    Object.assign(this, values);
  }

}
