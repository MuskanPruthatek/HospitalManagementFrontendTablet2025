import React, { act, useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../MainPage/BottomNav';

const Layout = () => {

    return (
        <div className='flex w-full h-screen'>
         
         <BottomNav/>

          <div className='w-full h-[90%] bg-transparent '>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
