//Not just to be used for areas! Can be used for any LWC element that requires a label value pair like a dual list box
public class areaWrapper {

     @AuraEnabled
    public string label {get; set;}
    @AuraEnabled
    public string value{get; set; }
    @AuraEnabled 
    public string areaType{get; set;}
    public areaWrapper(string label, string value, string areaType){
        this.label = label; 
        this.value = value; 
        this.areaType = areaType; 
    }
}