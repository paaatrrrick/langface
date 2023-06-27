import { useDispatch, useSelector } from 'react-redux';
import { setPopUpTemplate, clearPopUpTemplate } from '../../store';
import "./navbar.css"

const Navbar = () => {
    const dispatch = useDispatch();
    return (
        <div className="navbar">
            <div className="left">
                <h4>BloggerGPT</h4><p className='italic'> beta</p>
            </div>
            <div className="right">
            <a href="https://discord.gg/5FuTkB6X" target='_blank'>Join Discord</a> 
            <a href="https://blog.langface.ai" target='_blank'>Check Out Blog</a>
            <a onClick={() => dispatch(setPopUpTemplate("settings"))}>Settings</a>
            <a onClick={() => dispatch(setPopUpTemplate("tutorial"))}>Tutorial</a>
            </div>           
        </div>
    )
}

export default Navbar;