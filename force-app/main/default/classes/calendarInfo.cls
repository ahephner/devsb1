public class calendarInfo {
	@AuraEnabled(Cacheable=true)
    public static list<Holiday> getHolidays(){
        list<holiday> days = [select Id, ActivityDate, isAllDay, Name from holiday];
        return days; 
    }
}