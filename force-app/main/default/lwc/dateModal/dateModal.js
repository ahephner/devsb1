import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class DateModal extends LightningElement {
    copyDate

    handleDate(e){
        this.copyDate = e.target.value; 
    }
    closeModal(){
        this.dispatchEvent(new CustomEvent('close'));
    }
    submitDetails(){
        if(this.copyDate != undefined){
            this.dispatchEvent(new CustomEvent('savedate',{
                detail: this.copyDate
            }))

        }else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Date!',
                    message: 'Make sure the date is filled in',
                    variant: 'error'
                })
            )
        }

    }
}