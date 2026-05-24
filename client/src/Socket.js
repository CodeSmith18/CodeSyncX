import {io} from 'socket.io-client';
import { API_BASE_URL } from './config';

export const initSocket = async () =>{
    const options = {
        'force new connection': true,
        reconnectionAttempts : 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    return io(API_BASE_URL, options);
}
