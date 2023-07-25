import React, { useState } from 'react';
const Links = ({specs, setSpecs}) => {
    const [links, setLinks] = useState([...specs.links]);

    const getValidLinks = (linksToTest) => {
        const validLinks = [];
        for (let link of linksToTest) {
            if (link.url !== '' && link.description !== '') {
                validLinks.push(link);
            }
        }
        return validLinks;
    }

    const linkChange = (e, index, aspect) => {
        const newLinks = [...links];
        if (e.target.value === '' && ((aspect === 'url' &&  newLinks[index]['description'] === '') ||  (aspect === 'description' &&  newLinks[index]['url'] === ''))) {
            newLinks.splice(index, 1);
        } else {
            if (newLinks[index] === undefined) {
                newLinks[index] = {url: '', description: ''};
            }
            newLinks[index][aspect] = e.target.value;
        }        
        setLinks(newLinks);
        setSpecs({...specs, ...{links: getValidLinks(newLinks)}});
    }

    const removelink = (index) => {
        const newLinks = [...links];
        newLinks.splice(index, 1);
        setLinks(newLinks);
        setSpecs({...specs, ...{links: getValidLinks(newLinks)}});
    }

    const newLinks = [...links];
    if (newLinks.length === getValidLinks(newLinks).length) {
        newLinks.push({url: '', description: ''});
    }
    return (
        <div className='specificatication-inputs'>
            <label htmlFor='subject'>What is your value proposition?</label>
            {
                newLinks.map((link, index) => {
                    return ( <LinkRow key={index} link={link} index={index} linkChange={linkChange} removelink={removelink} />)
                })
            }
        </div>
    );
};


const LinkRow = ({link, index, linkChange, removelink}) => {
    return (
        <div className="insights-row ">
            <input type="text" className='specificatication-inputs-input specificatication-input-small' name="link" value={link.url} placeholder='Chess timing should focus on the opening' onChange={(e) => linkChange(e, index, "url")}/>
            <input type="text" className='specificatication-inputs-input specificatication-input-small' name="link" value={link.description} placeholder='Chess timing should focus on the opening' onChange={(e) => linkChange(e, index, "description")}/>
            {(link.url || link.description) && <button onClick={() => {removelink(index)}} className='links-btn x'>&times;</button>}
        </div>
    )
}
export default Links;

