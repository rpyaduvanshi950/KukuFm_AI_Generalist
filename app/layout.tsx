import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Nyaya — Your legal next step',description:'Understand your options, organise your facts and prepare your next step. An India-focused legal information companion.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
