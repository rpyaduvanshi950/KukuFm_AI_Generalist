export const runtime='nodejs';
// Preserve old sign-in links by sending them directly to the public workspace.
export function GET(){return new Response(null,{status:303,headers:{Location:'/', 'Cache-Control':'no-store'}})}
