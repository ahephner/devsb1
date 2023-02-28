//this is where you can add more values to be added to the new apps

public with sharing class appWrapper {
	@AuraEnabled
    public String appName {get;set;} 
    @AuraEnabled
    public Date appDate {get;set;} 
    @AuraEnabled
    public String appArea {get;set;} 
    @AuraEnabled
    public String appNote {get;set;}
}