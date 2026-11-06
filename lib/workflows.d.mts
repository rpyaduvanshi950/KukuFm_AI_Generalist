export type WorkflowNotes=Record<string,string>;
export const workflowDefinitions:Record<string,{title:string;intro:string;fields:Array<[string,string,string[]?]>;caution:string;filename:string}>;
export function workflowChecklist(topic:string,notes?:WorkflowNotes):string[];
export function workflowBrief(topic:string,notes?:WorkflowNotes):string;
export const documentTasks:Array<[string,string]>;
