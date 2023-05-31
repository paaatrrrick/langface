import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './home.css';
import constants from '../../constants';
import Loader from '../loader';
import getJwt from '../../utils/getJwt';
import { setPopUpMessage } from '../../store';
import { useDispatch } from 'react-redux';
import PopUp from '../popup';
let socket;

const Home = () => {
  const dispatch = useDispatch();

  const [loops, setLoops] = useState('');
  const [jwt, setJwt] = useState('');
  const [id, setId] = useState('');
  const [content, setContent] = useState('');
  const [data, setData] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [showPopUp, setShowPopUp] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io(constants.url);
    return () => {
      socket.disconnect();
    };
  }, []);


  useEffect(() => {
    scrollToBottom();
  }, [data])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleJWT = async () => {
    getJwt(setJwt, (myStr) => {
      dispatch(setPopUpMessage({ message: myStr, type: 'error', timeout: 3000 }))
    });
  }


  const handleSubmit = async () => {
    if (hasStarted) return
    setData([]);
    setHasStarted(true);
    const openAIKey = localStorage.getItem('openAIKey');
    const newData = { jwt, loops, id, content, openAIKey };
    socket.on('updateData', (incomingData) => {
      console.log(incomingData);
      if (incomingData.type === 'ending') {
        setHasStarted(false);
        socket.off('updateData');
      }
      setData(prevData => [...prevData, incomingData]);
    })
    socket.emit('addData', newData);
  };

  const canStart = jwt !== '' && id !== '' && content !== '' && loops !== '';
  return (
    <div className="Home">
      {showPopUp && <PopUp close={() => { setShowPopUp('') }} template={showPopUp} />}
      <div className="container">
        <div className="title">
          <h3>bloggerGPT</h3>
          <p>Post hundreds of blog posts with just a click of a button</p>
        </div>
        <div className="data">
          {(!hasStarted && data.length === 0) &&
            <div className='emptyData-messages'>
              <h5
                onClick={() => { setShowPopUp('tutorial') }}>
                How to get started?
              </h5>
              <h5 onClick={() => { setShowPopUp('settings') }}>Settings</h5>
            </div>
          }
          {data.map((item, index) => (
            <div key={index} className='mainDiv'>
              {item.type === 'success' &&
                <div className="success" >
                  <h4>
                    {item.title}
                  </h4>
                  <p>{item.content}</p>
                  <a href={item.url} target="_blank">View Post</a>
                </div>
              }
              {item.type === 'error' &&
                <div className="error" >
                  <p>{item.error}</p>
                </div>}
              {item.type === 'ending' &&
                <div className="success" >
                  <h4>
                    {item.content}
                  </h4>
                </div>
              }
            </div>
          ))}
          {
            hasStarted &&
            <div ref={messagesEndRef} className='loader-container'>
              <Loader />
            </div>
          }
        </div>
        <div className="inputs">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder='What is your blog post about' />
          <div className='inputsCont'>
            <input className='loops' type='number' value={loops} onChange={e => setLoops(e.target.value)} placeholder='How many posts do you want' />
            <input type='text' value={id} onChange={e => setId(e.target.value)} placeholder='Enter your blogger.com ID' />
            <button onClick={handleJWT} className={`google ${jwt !== '' && 'googleGood'}`} disabled={jwt !== ''}>{jwt ? 'Logged In' : 'Login With Google'}</button>
            <button onClick={handleSubmit} disabled={!(!hasStarted && canStart)} className='runButton'>Run!</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
