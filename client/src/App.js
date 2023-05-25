import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import constants from './constants';
let socket;

const App = () => {
  const [loops, setLoops] = useState('');
  const [jwt, setJwt] = useState('');
  const [id, setId] = useState('');
  const [content, setContent] = useState('');
  const [data, setData] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef(null);



  const getJwt = async () => {
    var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Parameters to pass to OAuth 2.0 endpoint.
    var params = {
      'client_id': '406198750695-i6p3k9r380io0tlre38j8jsvv2o4vmk7.apps.googleusercontent.com',
      'redirect_uri': constants.localUrl,
      'response_type': 'token',
      'scope': 'https://www.googleapis.com/auth/blogger',
      'include_granted_scopes': 'true',
      'state': 'pass-through value'
    };
    // Create the OAuth URL
    var url = oauth2Endpoint + '?' + Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
    // Open the new window
    const newWin = window.open(url, "_blank");
    // Poll the new window's location for the access token
    var tokenCheckInterval = setInterval(() => {
      try {
        console.log('checking location');
        //@ts-ignore
        if (newWin.location.href.includes('access_token')) {
          clearInterval(tokenCheckInterval);
          //@ts-ignore
          const newWinURI = newWin.location.href;
          const token = newWinURI.substring(newWinURI.indexOf("access_token=") + 13, newWinURI.indexOf("&token_type"));
          console.log(token);
          console.log('done');
          //@ts-ignore
          newWin.close();
          setJwt(token);
        }
      } catch (e) {
        console.log('bad location');
      }
    }, 50);
  };


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

  const handleSubmit = () => {
    if (hasStarted) return
    setData([]);
    setHasStarted(true);
    const newData = { jwt, loops, id, content };
    socket.on('updateData', (incomingData) => {
      console.log('data is updating')
      console.log(incomingData);
      if (incomingData.type === 'ending') {
        setHasStarted(false);
      }
      setData(prevData => [...prevData, incomingData]);
    })
    socket.emit('addData', newData);
  };

  const canStart = jwt !== '' && id !== '' && content !== '' && loops !== '';
  console.log('re rendering');
  console.log(data);
  return (
    <div className="App">
      <div className="container">
        <div className="title">
          <h3>bloggerGPT</h3>
          <p>Post hundreds of blog posts with just a click of a button</p>
        </div>
        <div className="data">
          {data.length === 0 && <h5>nothing created yet</h5>}
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
          <div ref={messagesEndRef} />
        </div>
        <div className="inputs">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder='What is your blog post about' />
          <div className='inputsCont'>
            <input className='loops' type='number' value={loops} onChange={e => setLoops(e.target.value)} placeholder='How many posts do you want' />
            <input type='text' value={id} onChange={e => setId(e.target.value)} placeholder='Enter your blogger.com ID' />
            {/* <a href={'https://www.blogger.com/'} target='_blank'>Create an account here</a> */}
            <button onClick={getJwt} className={`google ${jwt !== '' && 'googleGood'}`} disabled={jwt !== ''}>{jwt ? 'Logged In' : 'Login With Google'}</button>
            <button onClick={handleSubmit} disabled={!(!hasStarted && canStart)} className='runButton'>Run!</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
