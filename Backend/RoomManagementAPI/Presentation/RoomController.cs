using Microsoft.AspNetCore.Mvc;
using RoomManagementAPI.Business;
using RoomManagementAPI.Models;

namespace RoomManagementAPI.Presentation
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly ILogger<RoomsController> _logger;

        public RoomsController(IRoomService roomService, ILogger<RoomsController> logger)
        {
            _roomService = roomService;
            _logger = logger;
        }

        /// <summary>
        /// Get all rooms
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Room>>> GetAllRooms()
        {
            try
            {
                var rooms = await _roomService.GetAllRoomsAsync();
                return Ok(rooms);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all rooms");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get room by id
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Room>> GetRoomById(int id)
        {
            try
            {
                var room = await _roomService.GetRoomByIdAsync(id);
                return Ok(room);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting room");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Create a new room
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Room>> CreateRoom([FromBody] Room room)
        {
            try
            {
                var createdRoom = await _roomService.CreateRoomAsync(room);
                return CreatedAtAction(nameof(GetRoomById), new { id = createdRoom.Id }, createdRoom);
            }
            catch (ArgumentNullException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest("Room data is required");
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating room");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update an existing room
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Room>> UpdateRoom(int id, [FromBody] Room room)
        {
            try
            {
                var updatedRoom = await _roomService.UpdateRoomAsync(id, room);
                return Ok(updatedRoom);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating room");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete a room
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRoom(int id)
        {
            try
            {
                await _roomService.DeleteRoomAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting room");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
