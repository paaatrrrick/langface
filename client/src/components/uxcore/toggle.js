import React from 'react'
import { Switch } from '@headlessui/react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Toggle({value, setValue, text, tinyText}) {
  
  const setValueSwapper = () => {
    setValue(!value);
  }

  return (
    <Switch.Group as="div" className="flex items-center">
      <Switch
        checked={value}
        onChange={setValueSwapper}
        className={classNames(
          value ? 'bg-brandColor' : 'bg-lightGray',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brandColor focus:ring-offset-2'
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            value ? 'translate-x-5' : 'translate-x-0',
            ' translate-y-0.5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-mainWhite shadow ring-0 transition duration-200 ease-in-out'
          )}
        />
      </Switch>
      <Switch.Label as="span" className="text-sm">
        <span style={{marginLeft: '5px'}} className="font-medium text-gray-900">{text}</span>{' '}
        <span className="text-gray-500">{tinyText}</span>
      </Switch.Label>
    </Switch.Group>
  )
}