
package com.example.taskflow.task;

import com.example.taskflow.task.dto.CreateTaskRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.taskflow.task.dto.TaskResponse;
import com.example.taskflow.task.dto.UpdateTaskRequest;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createTask(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication
    ) {
        return taskService.createTask(request, authentication);
    }


    @GetMapping
    public List<TaskResponse> getMyTasks(
            Authentication authentication
    ) {
        return taskService.getMyTasks(authentication);
    }


    @GetMapping("/{id}")
    public TaskResponse getMyTaskById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return taskService.getMyTaskById(id, authentication);
    }


    @PutMapping("/{id}")
    public TaskResponse updateMyTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request,
            Authentication authentication
    ) {
        return taskService.updateMyTask(id, request, authentication);
    }


    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyTask(
            @PathVariable Long id,
            Authentication authentication
    ) {
        taskService.deleteMyTask(id, authentication);
    }




}
