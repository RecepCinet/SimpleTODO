import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('İş');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [viewMode, setViewMode] = useState('category'); // 'all' veya 'category'
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState(['Tümü', 'İş', 'Kişisel', 'Alışveriş', 'Sağlık', 'Diğer']);
  const inputRef = useRef(null);

  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
    } catch (error) {
      console.error('Görevler kaydedilemedi:', error);
    }
  };

  const saveCategories = async (newCategories) => {
    try {
      await AsyncStorage.setItem('categories', JSON.stringify(newCategories));
    } catch (error) {
      console.error('Kategoriler kaydedilemedi:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('categories');
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, []);

  const addTask = () => {
    if (inputText.trim()) {
      const newTasks = [{ 
        id: Date.now(), 
        text: inputText, 
        completed: false, 
        category: selectedCategory 
      }, ...tasks];
      setTasks(newTasks);
      saveTasks(newTasks);
      setInputText('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const getTasksByCategory = () => {
    if (selectedCategory === 'Tümü') {
      // Tümü seçiliyse tüm kategorileri gruplu göster
      const grouped = {};
      categories.slice(1).forEach(cat => { // 'Tümü'yü hariç tut
        const categoryTasks = tasks.filter(task => task.category === cat);
        if (categoryTasks.length > 0) {
          grouped[cat] = categoryTasks;
        }
      });
      return grouped;
    } else if (viewMode === 'category') {
      // Sadece seçili kategorideki görevleri göster
      const categoryTasks = tasks.filter(task => task.category === selectedCategory);
      return { [selectedCategory]: categoryTasks };
    } else {
      // Tüm kategorileri gruplu göster
      const grouped = {};
      categories.slice(1).forEach(cat => { // 'Tümü'yü hariç tut
        grouped[cat] = tasks.filter(task => task.category === cat);
      });
      return grouped;
    }
  };


  const toggleTask = (id) => {
    const newTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const deleteTask = (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Bu görevi silmek istediğinizden emin misiniz?');
      if (confirmed) {
        const newTasks = tasks.filter(task => task.id !== id);
        setTasks(newTasks);
        saveTasks(newTasks);
      }
    } else {
      Alert.alert(
        'Görevi Sil',
        'Bu görevi silmek istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Sil', onPress: () => {
            const newTasks = tasks.filter(task => task.id !== id);
            setTasks(newTasks);
            saveTasks(newTasks);
          }}
        ]
      );
    }
  };

  const startEditTask = (task) => {
    setEditingTask(task.id);
    setEditText(task.text);
  };

  const saveEditTask = (id) => {
    if (editText.trim()) {
      const newTasks = tasks.map(task => 
        task.id === id ? { ...task, text: editText } : task
      );
      setTasks(newTasks);
      saveTasks(newTasks);
      setEditingTask(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditText('');
  };

  const startMoveTask = (task) => {
    setTaskToMove(task);
    setShowMoveModal(true);
  };

  const moveTask = (newCategory) => {
    if (taskToMove) {
      const newTasks = tasks.map(task => 
        task.id === taskToMove.id ? { ...task, category: newCategory } : task
      );
      setTasks(newTasks);
      saveTasks(newTasks);
      setTaskToMove(null);
      setShowMoveModal(false);
    }
  };

  const addCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      const newCategories = [...categories, newCategoryName.trim()];
      setCategories(newCategories);
      saveCategories(newCategories);
      setNewCategoryName('');
    }
  };

  const deleteCategory = (categoryToDelete) => {
    console.log('Delete category clicked:', categoryToDelete); // Debug log
    if (categoryToDelete === 'Tümü') return; // Tümü silinemez
    
    const categoryTasks = tasks.filter(task => task.category === categoryToDelete);
    const taskCount = categoryTasks.length;
    
    const message = taskCount > 0 
      ? `"${categoryToDelete}" kategorisini silmek istediğinizden emin misiniz?\n\nBu kategoriye bağlı ${taskCount} görev de silinecek.`
      : `"${categoryToDelete}" kategorisini silmek istediğinizden emin misiniz?`;
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        // Kategorideki görevleri sil
        const newTasks = tasks.filter(task => task.category !== categoryToDelete);
        setTasks(newTasks);
        saveTasks(newTasks);
        
        // Kategoriyi sil
        const newCategories = categories.filter(cat => cat !== categoryToDelete);
        setCategories(newCategories);
        saveCategories(newCategories);
        
        // Eğer silinen kategori seçiliyse, İş kategorisine geç
        if (selectedCategory === categoryToDelete) {
          setSelectedCategory('İş');
        }
        
        console.log('Category deleted:', categoryToDelete);
      }
    } else {
      Alert.alert(
        'Kategori Sil',
        message,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Sil', style: 'destructive', onPress: () => {
            // Kategorideki görevleri sil
            const newTasks = tasks.filter(task => task.category !== categoryToDelete);
            setTasks(newTasks);
            saveTasks(newTasks);
            
            // Kategoriyi sil
            const newCategories = categories.filter(cat => cat !== categoryToDelete);
            setCategories(newCategories);
            saveCategories(newCategories);
            
            // Eğer silinen kategori seçiliyse, İş kategorisine geç
            if (selectedCategory === categoryToDelete) {
              setSelectedCategory('İş');
            }
            
            console.log('Category deleted:', categoryToDelete);
          }}
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Text style={styles.versionText}>Simple TODO v{Constants.expoConfig?.version || '1.0.0'}</Text>

      <TouchableOpacity 
        style={styles.categoryButton} 
        onPress={() => setShowCategoryModal(true)}
      >
        <Text style={styles.categoryButtonText}>Kategori: {selectedCategory} ▼</Text>
      </TouchableOpacity>

      {selectedCategory !== 'Tümü' && (
        <View style={styles.inputSection}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Yeni görev ekle..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={addTask}
          />
          <TouchableOpacity style={styles.addButton} onPress={addTask}>
            <Text style={styles.buttonText}>Ekle</Text>
          </TouchableOpacity>
        </View>
      )}

      {(() => {
        const currentTasks = selectedCategory === 'Tümü'
          ? tasks
          : tasks.filter(task => task.category === selectedCategory);
        const completedTasks = currentTasks.filter(t => t.completed).length;
        const totalTasks = currentTasks.length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return totalTasks > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {percentage}%
            </Text>
          </View>
        );
      })()}

      <ScrollView style={styles.taskList}>
        {Object.entries(getTasksByCategory()).map(([category, categoryTasks]) => (
          categoryTasks.length > 0 && (
            <View key={category}>
              {(() => {
                if (selectedCategory === 'Tümü') {
                  const completedCount = categoryTasks.filter(t => t.completed).length;
                  const totalCount = categoryTasks.length;
                  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                  
                  return (
                    <View style={styles.categoryHeaderContainer}>
                      <Text style={styles.categoryHeader}>{category}</Text>
                      <View style={styles.categoryProgressContainer}>
                        <View style={styles.categoryProgressBar}>
                          <View 
                            style={[
                              styles.categoryProgressFill, 
                              { width: `${percentage}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.categoryProgressText}>{percentage}%</Text>
                      </View>
                    </View>
                  );
                } else {
                  return <Text style={styles.categoryHeader}>{category}</Text>;
                }
              })()}
              {categoryTasks.map(task => (
                <View key={task.id} style={styles.taskItem}>
                  {editingTask === task.id ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={styles.editInput}
                        value={editText}
                        onChangeText={setEditText}
                        autoFocus
                      />
                      <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={() => saveEditTask(task.id)}
                      >
                        <Text style={styles.saveButtonText}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={cancelEdit}
                      >
                        <Text style={styles.cancelButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={styles.taskText} 
                        onPress={() => toggleTask(task.id)}
                      >
                        <Text style={[
                          styles.taskTextContent,
                          task.completed && styles.completedTask
                        ]}>
                          {task.text}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.editButton} 
                        onPress={() => startEditTask(task)}
                      >
                        <Text style={styles.editButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.moveButton} 
                        onPress={() => startMoveTask(task)}
                      >
                        <Text style={styles.moveButtonText}>📁</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => deleteTask(task.id)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
            </View>
          )
        ))}
      </ScrollView>

      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategori Seç</Text>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selectedCategory === category && styles.selectedCategoryOption
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryModal(false);
                }}
              >
                <View style={styles.categoryOptionContent}>
                  <Text style={styles.categoryIndicator}>
                    {selectedCategory === category ? '›' : ''}
                  </Text>
                  <Text style={[
                    styles.categoryOptionText,
                    selectedCategory === category && styles.selectedCategoryOptionText
                  ]}>{category}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.manageCategoriesButton} 
              onPress={() => {
                setShowCategoryModal(false);
                setShowManageCategoriesModal(true);
              }}
            >
              <Text style={styles.manageCategoriesButtonText}>Kategorileri Yönet</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMoveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Taşı</Text>
            <Text style={styles.taskToMoveText}>"{taskToMove?.text}"</Text>
            {categories.filter(cat => cat !== 'Tümü' && cat !== taskToMove?.category).map(category => (
              <TouchableOpacity
                key={category}
                style={styles.categoryOption}
                onPress={() => moveTask(category)}
              >
                <Text style={styles.categoryOptionText}>{category}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowMoveModal(false)}
            >
              <Text style={styles.closeButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showManageCategoriesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManageCategoriesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategorileri Yönet</Text>
            
            <View style={styles.addCategorySection}>
              <TextInput
                style={styles.categoryInput}
                placeholder="Yeni kategori adı..."
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                onSubmitEditing={addCategory}
              />
              <TouchableOpacity style={styles.addCategoryButton} onPress={addCategory}>
                <Text style={styles.addCategoryButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.categoriesListTitle}>Mevcut Kategoriler:</Text>
            {categories.filter(cat => cat !== 'Tümü').map(category => (
              <View key={category} style={styles.categoryManageItem}>
                <Text style={styles.categoryManageText}>{category}</Text>
                <TouchableOpacity 
                  style={styles.deleteCategoryButton} 
                  onPress={() => {
                    console.log('Button pressed for category:', category);
                    deleteCategory(category);
                  }}
                >
                  <Text style={styles.deleteCategoryButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowManageCategoriesModal(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {(() => {
        const currentTasks = selectedCategory === 'Tümü'
          ? tasks
          : tasks.filter(task => task.category === selectedCategory);
        const completedTasks = currentTasks.filter(t => t.completed).length;
        const totalTasks = currentTasks.length;
        
        return totalTasks > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{totalTasks}</Text>
              <Text style={styles.summaryLabel}>Toplam</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{completedTasks}</Text>
              <Text style={styles.summaryLabel}>Tamamlanan</Text>
            </View>
          </View>
        );
      })()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  versionText: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 10,
    color: '#999',
    zIndex: 1000,
  },
  inputSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5E7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    minWidth: 35,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 8,
    marginBottom: 6,
    borderRadius: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskText: {
    flex: 1,
  },
  taskTextContent: {
    fontSize: 14,
    color: '#333',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
    fontSize: 14,
  },
  editButton: {
    padding: 5,
    marginRight: 5,
  },
  editButtonText: {
    fontSize: 14,
  },
  moveButton: {
    padding: 5,
    marginRight: 5,
  },
  moveButtonText: {
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 14,
  },
  categoryButton: {
    backgroundColor: '#8E8E93',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  categoryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoryHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 15,
    marginBottom: 10,
    marginLeft: 5,
  },
  categoryHeaderContainer: {
    marginTop: 15,
    marginBottom: 10,
    marginLeft: 5,
  },
  categoryProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 8,
  },
  categoryProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  categoryProgressText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    minWidth: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  taskToMoveText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  categoryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCategoryOption: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    width: 20,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectedCategoryOptionText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  manageCategoriesButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  manageCategoriesButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addCategorySection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  categoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 14,
  },
  addCategoryButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  addCategoryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  categoriesListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  categoryManageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryManageText: {
    fontSize: 14,
    color: '#333',
  },
  deleteCategoryButton: {
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  deleteCategoryButtonText: {
    fontSize: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 40,
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default App;
