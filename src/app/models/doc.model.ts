import { Datetime } from '@ionic/angular';





export class Doc {
  _id?: string | number;
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

export class EventItem extends Doc {
  content?: string;
  note?: string;
  start?: Date;
  end?: Date;
  type?: 'box' | 'point' | 'range' | 'background';
  group?: string;
  subgroup?: string;

  constructor(values: Object = {}) {
    super();
    Object.assign(this, values);
  }

}
