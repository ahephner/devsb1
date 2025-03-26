public without sharing class appWeather {

	@AuraEnabled(Cacheable=true)
    public static list<Program__c> getWeatherInfo(Id recordId){
        list<Program__c> getInfo = [select Account__c, Account__r.BillingLatitude, Account__r.BillingLongitude, Preferred_Lat_Long__c, 
                                    Preferred_Zip_Code__c from Program__c where Id =: recordId];
        return getInfo; 
    }
    
    
}