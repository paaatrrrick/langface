import React from "react"
import HTML from "./html"
const HeroOne = ({demoClick}) => {
    return (
            <div class="relative isolate bg-white w-full">
                <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{"clip-path": "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%"}}></div>
                </div>
                <div class="py-32 w-full flex col align-center justify-center px-10">
                    <div class="flex row align-center justify-between w-full" style={{maxWidth: '1500px'}}>
                        <div className="w-2/5 p">
                            <h1 class="text-2xlg font-semibold tracking-tight text-mainDark-600 sm:text-5xl">Drive organic web traffic with optimized articles</h1>
                            <p class="mt-6 text-xl leading-8 text-mainDark-600">Get hundreds of SEO articles in seconds that are specialized to grow your business, using the help of AI</p>
                            <div class="mt-10 flex items-center justify-center gap-x-6">
                                <button onClick={demoClick} class="rounded-full w-60 h-10 bg-brandColor px-3.5 text-m text-center font-sm text-mainWhite">Try 3 free demo posts</button>
                            </div>
                        </div>
                        <div className="w-1/2" style={{height: '600px'}}>
                            <HTML/>
                        </div>
                    </div>
                </div>
            </div>
    )
}
export default HeroOne