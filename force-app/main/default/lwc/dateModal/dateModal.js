import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class DateModal extends LightningElement {
    copyDate
    @api selectedareaid;
    selOptions = []
    aOptions; 
    areaId; 
    // connectedCallback(){
    //     this.setAreas();
    // }

    @api
    get areas(){
        return this.aOptions
    }
    set areas(value){
        this.aOptions = value;
        this.copyAreas(this.aOptions); 
    }
    copyAreas(data){
        this.selOptions = data.map(item=>({
            ...item,
            lable: item.label,
            value: item.value
        })).filter((x)=>x.label != 'All')

        this.areaId= this.selectedareaid; 
        
    }

    handleAreaChange(evt){
        this.areaId = evt.detail.value;;
    }
    handleDate(e){
        this.copyDate = e.target.value; 
    }
    
    closeModal(){
        this.dispatchEvent(new CustomEvent('close'));
    }
    submitDetails(){
        if(this.copyDate != undefined){
            let out = {date:this.copyDate, area: this.areaId}
            this.dispatchEvent(new CustomEvent('savedate',{
                detail: out 
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