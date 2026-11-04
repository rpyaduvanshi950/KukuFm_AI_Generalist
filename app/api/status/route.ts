export async function GET(){return Response.json({configured:Boolean(process.env.AI_BASE_URL&&process.env.AI_MODEL)},{headers:{'Cache-Control':'no-store'}})}
