import { Routes } from '@angular/router';
import { Home } from '../features/home/home';
import { MemberDetailed, MemberList } from '../features/members';
import { Lists } from '../features/lists/lists';
import { Messages } from '../features/messages/messages';

export const routes: Routes = [
    {path: '', component: Home},
    {path: 'members', component: MemberList},
    {path: 'members/:id', component: MemberDetailed},
    {path: 'lists', component: Lists},
    {path: 'messages', component: Messages},
    {path: '**', component: Home}
];
