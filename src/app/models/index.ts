import { generateCollectionId } from '../utils';


export const EVENT_SERVICE = 'e';
export const FILE_SERVICE = 'f';
export const GROUP_SERVICE = 'g';
export const SETTINGS_SERVICE = 's';
export const PROJECT_SERVICE = 'p';
export const PROJECT_INDEX_SERVICE = 'pi';

export const LASTCHAR = String.fromCharCode(65535);

export class Doc {
  public _id?: string;
  public _rev?: string;
  public _deleted?: boolean;
  public updated?: number;

  constructor(values: Object = {}) {
      Object.assign(this, values);
  }

}

export class ProjectItem extends Doc {
  public name?: string;
  public note?: string;

  public user?;
  public meta_access?;
  public childId?;


}


export class FileItem extends Doc {
  public name?: string;
  public note?: string;
  public filename?: string;
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

export class EventItem extends Doc {
  id?: string; //for working with visjs
  content?: string;
  note?: string;
  start?: Date;
  end?: Date;
  type?: 'box' | 'point' | 'range' | 'background';
  group?: string;
  subgroup?: string;
  _nestedGroups?: [String];
  nestedGroups?: [String];

  //design
  className?: string;
  icon?: string;

  to:Array<EdgeItem>;
  from:Array<EdgeItem>;

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
},{
  days: 0,
  type: 'viewHours'
}];

export class Task extends Doc {
  title?: string;
  note?: string;
  category?: string;
  today?: number;
  important?: number;
  priority?: number;
  remindDate?: Date;
  dueDate?: Date;
  done?: boolean;
  docType?: string;
}

export class EdgeItem {
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
  props.id = generateCollectionId('edge');
  props.arrows = 'to';
  props.dashes = false;

  return {...{},...props};
}






















