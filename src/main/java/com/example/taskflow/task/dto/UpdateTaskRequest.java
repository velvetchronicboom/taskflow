
package com.example.taskflow.task.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateTaskRequest(

        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title cannot exceed 150 characters")
        String title,

        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        String description,

        @NotBlank(message = "Priority is required")
        String priority,

        @NotBlank(message = "Status is required")
        String status,

        @NotNull(message = "Estimated minutes is required")
        @Min(value = 1, message = "Estimated minutes must be greater than zero")
        Long estimatedMinutes
) {}
