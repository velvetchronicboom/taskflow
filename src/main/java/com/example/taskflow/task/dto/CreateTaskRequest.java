
package com.example.taskflow.task.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTaskRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title cannot exceed 150 characters")
        String title,

        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        String description,

        String priority,

        @NotNull(message = "Estimated minutes is required")
        @Min(value = 1, message = "Estimated minutes must be at least 1")
        Long estimatedMinutes
) {
}
