import Link from 'next/link';
import BenchmarkBrowser from '../../components/benchmark-browser';
import data from '../../benchmarks/v5/browser-data.json';
export const metadata={title:'Test cases and results | Nyaya',description:'Inspect synthetic evaluation inputs, recorded responses, failures and limitations.'};
export default function Benchmarks(){return <div className="guide-standalone"><header className="guide-site-header"><Link href="/" className="brand">nyaya.</Link><Link className="outline-button" href="/">Back to workspace</Link></header><main><BenchmarkBrowser data={data}/></main><footer><span>Nyaya</span><p>Implementer-authored evaluation. Independent legal review pending.</p></footer></div>}
