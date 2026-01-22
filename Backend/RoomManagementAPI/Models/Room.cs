namespace RoomManagementAPI.Models
{
    public class Room
    {
        public int Id { get; set; }
        public required string RoomName { get; set; }
        public required string RoomNumber { get; set; }
        public int Capacity { get; set; }
        public required string Location { get; set; }
        public required string Status { get; set; } // Available, Occupied, Maintenance
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
    }
}
