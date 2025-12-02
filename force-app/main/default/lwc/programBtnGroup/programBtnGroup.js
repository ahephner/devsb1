import { LightningElement,wire } from 'lwc';
import { MessageContext, publish} from 'lightning/messageService';
export default class ProgramBtnGroup extends LightningElement {
        @wire(MessageContext)
        messageContext; 
    handleNewEvent(){
            const payload = {
                connector: true,
                // message: this.selectedLabel,
                // areaId: this.area,
                // accountId: this.accID
            }
            publish(this.messageContext, Program_Builder, payload); 
    }
}