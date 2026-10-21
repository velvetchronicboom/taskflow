
package com.example.taskflow.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByOwner_Id(Long ownerId);
    Optional<Task> findByIdAndOwner_Id(Long id, Long ownerId);


}
