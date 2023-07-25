import React, { useState } from 'react';
const Insights = ({specs, setSpecs}) => {
    const [insights, setInsights] = useState([...specs.insights]);

    const insightChange = (e, index) => {
        const newInsights = [...insights];
        if (e.target.value === '') {
            newInsights.splice(index, 1);
        } else {
            newInsights[index] = e.target.value;
        }        
        setInsights(newInsights);
        setSpecs({...specs, ...{insights: newInsights}});
    }

    const removeInsight = (index) => {
        const newInsights = [...insights];
        newInsights.splice(index, 1);
        setInsights(newInsights);
        setSpecs({...specs, ...{insights: newInsights}});
    }

    const newInsights = [...insights, ''];

    return (
        <div className='specificatication-inputs'>
            <label htmlFor='subject'>What are unique insights you have into this business?</label>
            {
                newInsights.map((insight, index) => {
                    return ( <InsightRow key={index} insight={insight} index={index} insightChange={insightChange} removeInsight={removeInsight} />)
                })
            }
        </div>
    );
};


const InsightRow = ({insight, index, insightChange, removeInsight}) => {
    return (
        <div className="insights-row">
            <input type="text" className='specificatication-inputs-input' name="insight" value={insight} placeholder='Chess timing should focus on the opening' onChange={(e) => insightChange(e, index)}/>
            {insight && <button onClick={() => {removeInsight(index)}} className='insights-btn x'>&times;</button>}
        </div>
    )
}
export default Insights;

