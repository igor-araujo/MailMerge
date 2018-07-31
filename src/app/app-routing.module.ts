import { HomeComponent } from './components/home/home.component';
import { DocumentComponent } from './components/document/document.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    { path: '', component: HomeComponent},
    { path: 'document', component: DocumentComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
