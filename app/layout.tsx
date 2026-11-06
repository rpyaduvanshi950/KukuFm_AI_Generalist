import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Nyaya | Legal information and case notes',description:'Legal information for India. Read documents, organise case notes and prepare factual requests.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
