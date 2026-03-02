import './globals.css'
import Navbar from '@/components/navbar'

export const metadata = {
  title: 'TheFundedDiaries - Elite Capital for Skilled Traders',
  description: 'Premium prop trading firm offering instant funding and professional trading challenges',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="bg-black text-white antialiased">
        <div className="lux-page min-h-screen">
          <Navbar />
          <div className="pt-24">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
