export const refundQuestions:Array<[string,string,string]>;
export const refundDetailFields:Array<[string,string,string]>;
export function missingRefundFacts(facts?:Record<string,string>):Array<[string,string,string]>;
export function refundRequest(facts:Record<string,string>,details?:Record<string,string>,language?:string):string;
export function refundPreparationSummary(facts?:Record<string,string>,details?:Record<string,string>):string;
export function refundAnalysisQuestion(facts?:Record<string,string>,details?:Record<string,string>,language?:string):string;
export function refundSuggestions(facts?:Record<string,string>):Array<{field:string;value:string;quote:string}>;
