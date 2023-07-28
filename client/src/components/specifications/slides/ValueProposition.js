import React from 'react';
const ValueProposition = ({specs, setSpecs}) => {
    const { valueProposition } = specs;
    return (
        <div className='specificatication-inputs'>
            <label htmlFor='subject'>How is your business differentiated in this niche?</label>
            <textarea id='subject' className='specificatication-inputs-input' type='text' placeholder='At Apple we deliver unmatched user experience through innovative, high-quality technology products that are designed with elegance and simplicity.' value={valueProposition} onChange={(e) => setSpecs({...specs, ...{valueProposition: e.target.value}})}/>
            {/* <label htmlFor='productDescription'>Blog Description</label>
            <input id='productDescription' type='text' placeholder='Blog Description' value={productDescription} onChange={(e) => setSpecs({...specs, ...{productDescription: e.target.value}})}/> */}
        </div>
    );
};
export default ValueProposition;