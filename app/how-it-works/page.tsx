import type {Metadata} from 'next';
import Link from 'next/link';
import HowItWorks from '../../components/how-it-works';
export const metadata:Metadata={title:'How Nyaya works — Detailed guide',description:'A detailed explanation of Nyaya’s legal information workflows, document reading, evidence verdicts, benchmarks, privacy and usage limits.'};
export default function GuidePage(){return <div className="guide-standalone"><header className="guide-site-header"><Link href="/" className="brand">nyaya.</Link><Link href="/" className="outline-button">Back to workspace</Link></header><main><HowItWorks/></main><footer><span className="footer-brand">nyaya.</span><p>Legal information and preparation. Independent lawyer review remains pending.</p><a href="#guide-title">Back to top ↑</a></footer></div>}
