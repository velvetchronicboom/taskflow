
package com.example.taskflow.task;

import com.example.taskflow.task.dto.CreateTaskRequest;
import com.example.taskflow.user.AppUser;
import com.example.taskflow.user.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.taskflow.task.dto.TaskResponse;
import com.example.taskflow.task.dto.UpdateTaskRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final AppUserRepository appUserRepository;

    public TaskService(
            TaskRepository taskRepository,
            AppUserRepository appUserRepository
    ) {
        this.taskRepository = taskRepository;
        this.appUserRepository = appUserRepository;
    }

    private TaskResponse toTaskResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                task.getStatus(),
                task.getEstimatedMinutes(),
                task.getCreatedAt()
        );
    }

    @Transactional
    public TaskResponse createTask(
            CreateTaskRequest request,
            Authentication authentication
    ){
        if (request.estimatedMinutes() == null
                || request.estimatedMinutes() <= 0) {
            throw new IllegalArgumentException(
                    "Estimated minutes must be greater than zero"
            );
        }

        String email = authentication.getName();

        AppUser owner = appUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        Task task = new Task();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setOwner(owner);

        if (request.priority() != null
                && !request.priority().isBlank()) {
            task.setPriority(request.priority().toUpperCase());
        }

        task.setEstimatedMinutes(request.estimatedMinutes());

        Task savedTask = taskRepository.save(task);
        return toTaskResponse(savedTask);
    }



    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(Authentication authentication) {
        String email = authentication.getName();

        AppUser owner = appUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        return taskRepository.findAllByOwner_Id(owner.getId())
                .stream()
                .map(this::toTaskResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public TaskResponse getMyTaskById(
            Long taskId,
            Authentication authentication
    ) {
        String email = authentication.getName();

        AppUser owner = appUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        Task task = taskRepository
                .findByIdAndOwner_Id(taskId, owner.getId())
                .orElseThrow(() ->
                        new org.springframework.web.server.ResponseStatusException(
                                org.springframework.http.HttpStatus.NOT_FOUND,
                                "Task not found"
                        )
                );

        return toTaskResponse(task);
    }


    @Transactional
    public TaskResponse updateMyTask(
            Long taskId,
            UpdateTaskRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();

        AppUser owner = appUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        Task task = taskRepository
                .findByIdAndOwner_Id(taskId, owner.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Task not found"
                        )
                );

        String priority = request.priority().trim().toUpperCase();
        String status = request.status().trim().toUpperCase();

        if (!java.util.Set.of("LOW", "MEDIUM", "HIGH").contains(priority)) {
            throw new IllegalArgumentException("Invalid priority");
        }

        if (!java.util.Set.of("TODO", "IN_PROGRESS", "DONE").contains(status)) {
            throw new IllegalArgumentException("Invalid status");
        }

        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setPriority(priority);
        task.setStatus(status);
        task.setEstimatedMinutes(request.estimatedMinutes());

        return toTaskResponse(taskRepository.save(task));
    }


    @Transactional
    public void deleteMyTask(
            Long taskId,
            Authentication authentication
    ) {
        String email = authentication.getName();

        AppUser owner = appUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        Task task = taskRepository
                .findByIdAndOwner_Id(taskId, owner.getId())
                .orElseThrow(() ->
                        new org.springframework.web.server.ResponseStatusException(
                                org.springframework.http.HttpStatus.NOT_FOUND,
                                "Task not found"
                        )
                );

        taskRepository.delete(task);
    }



}
