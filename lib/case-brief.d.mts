export type Event={date:string;description:string;source:string;id?:string};
export function validEvent(event:unknown):boolean;
export function sortedEvents<T extends Event>(events:T[]):T[];
export function lawyerBrief(input:{facts:Record<string,string>;events?:Event[];topic:string;evidenceChecked?:string[];attachments?:Array<{name:string;coverage?:string;warnings?:string[]}>;analysis?:any;sources?:Array<{id:string;title:string;checked:string;url:string}>;warnings?:string[];conflicts?:any[];resolutions?:any[];language?:string}):string;
