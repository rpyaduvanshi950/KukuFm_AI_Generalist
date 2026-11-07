export const runtime='nodejs';
export const dynamic='force-dynamic';
// The access proxy challenges this route before it can redirect to the workspace.
export function GET(){return new Response(null,{status:303,headers:{Location:'/','Cache-Control':'private, no-store','Vary':'Authorization'}})}
