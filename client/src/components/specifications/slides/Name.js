import React from 'react';
const Name = ({specs, setSpecs}) => {
    const { name, product } = specs;
    return (
        <div className='specificatication-inputs'>
            <label htmlFor='subject'>What is the name of your business?</label>
            <input id='subject' className='specificatication-inputs-input' type='text' placeholder='ex: Google' value={name} onChange={(e) => setSpecs({...specs, ...{name: e.target.value}})}/>

            <label htmlFor='subject' style={{marginTop: '25px'}}>What do you sell?</label>
            <textarea id='subject' className='specificatication-inputs-input' type='text' placeholder='ex: Google' value={product} onChange={(e) => setSpecs({...specs, ...{product: e.target.value}})}/>
            {/* <label htmlFor='productDescription'>Blog Description</label>
            <input id='productDescription' type='text' placeholder='Blog Description' value={productDescription} onChange={(e) => setSpecs({...specs, ...{productDescription: e.target.value}})}/> */}
        </div>
    );
};
export default Name;