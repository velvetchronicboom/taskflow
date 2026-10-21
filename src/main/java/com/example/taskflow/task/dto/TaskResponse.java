
package com.example.taskflow.task.dto;

import java.time.Instant;

public record TaskResponse(
        Long id,
        String title,
        String description,
        String priority,
        String status,
        Long estimatedMinutes,
        Instant createdAt
) {}
