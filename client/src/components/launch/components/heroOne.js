import React from "react"
import HTML from "./html"
const HeroOne = ({demoClick}) => {
    return (
            <div className="relative isolate bg-white w-full">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{"clipPath": "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%"}}></div>
                </div>
                <div className="py-32 w-full flex col align-center justify-center px-3 md:flex-row">
                    <div className="flex flex-col align-center justify-start md:justify-between w-full md:flex-row" style={{maxWidth: '1500px'}}>
                        <div className="w-full md:w-2/5">
                            <h1 className="font-semibold tracking-tight text-mainDark text-2xl md:text-4xl lg:text-5xl">Drive organic web traffic with optimized articles</h1>
                            <p className="mt-md text-xl leading-8 text-mainDar">Get hundreds of SEO articles in minutes that are specialized to grow your business, using the help of AI</p>
                            <div className="mt-md flex items-center justify-center gap-x-6">
                                <button onClick={demoClick} className="rounded-full w-60 h-10 bg-brandColor px-3.5 text-m text-center font-sm text-mainWhite">Try 3 free demo posts</button>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 flex flex-col align-center justify-center md:justify-start" style={{height: '600px'}}>
                            <HTML/>
                        </div>
                    </div>
                </div>
            </div>
    )
}
export default HeroOne