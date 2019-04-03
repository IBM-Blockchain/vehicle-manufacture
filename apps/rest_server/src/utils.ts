import { User } from './interfaces/users';
import * as x509 from '@ampretia/x509';

const extensionKey = '1.2.3.4.5.6.7.8.1';

export default class Utils {
    public static certToUser(certificate: string): User {
        const cert = x509.parseCert(certificate);
        const attrs = JSON.parse(cert.extensions[extensionKey]).attrs;
    
        const user: User = {
            role: attrs['vehicle_manufacture.role'],
            company: attrs['vehicle_manufacture.company']
        }
    
        return user;
    }
}