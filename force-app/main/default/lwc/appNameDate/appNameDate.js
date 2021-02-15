import { LightningElement } from 'lwc';

export default class AppNameDate extends LightningElement {


    cancel(){
        console.log('cancel...');
        
       this.dispatchEvent(new CustomEvent('cancel'));   
    }

    next(){
        this.dispatchEvent(new CustomEvent('next'))
        
    }
}